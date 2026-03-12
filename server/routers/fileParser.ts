/**
 * 文件解析路由
 * 支持格式：PDF、Word(.docx/.doc)、Excel(.xlsx/.xls/.csv)、图片(jpg/png/gif/webp)
 * 图片使用AI视觉识别提取文字内容
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

// ─── 文件类型检测 ─────────────────────────────────────────────────

function detectFileType(
  filename: string,
  mimeType: string
): "pdf" | "word" | "excel" | "csv" | "ppt" | "image" | "text" | "unknown" {
  const ext = filename.toLowerCase().split(".").pop() || "";
  const mime = mimeType.toLowerCase();

  // 优先使用文件扩展名检测（更可靠）
  if (ext === "pdf") return "pdf";
  if (ext === "docx" || ext === "doc") return "word";
  if (ext === "xlsx" || ext === "xls") return "excel";
  if (ext === "csv") return "csv";
  if (ext === "ppt" || ext === "pptx") return "ppt";
  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) return "image";
  if (ext === "txt" || ext === "md") return "text";

  // 如果扩展名不可用，则使用 MIME 类型
  if (mime === "application/pdf") return "pdf";
  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword"
  )
    return "word";
  if (
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mime === "application/vnd.ms-excel"
  )
    return "excel";
  if (mime === "text/csv") return "csv";
  if (
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mime === "application/vnd.ms-powerpoint"
  )
    return "ppt";
  if (mime.startsWith("image/")) return "image";
  if (mime === "text/plain" || mime === "text/markdown") return "text";

  return "unknown";
}

// ─── PDF 解析 ─────────────────────────────────────────────────────

async function parsePdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid ESM issues
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
    const result = await pdfParse(buffer);
    return result.text?.trim() || "";
  } catch (e) {
    console.error("[fileParser] PDF parse error:", e);
    throw new Error("PDF解析失败，请确认文件未加密且格式正确");
  }
}

// ─── Word 解析 ────────────────────────────────────────────────────

async function parseWord(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value?.trim() || "";
  } catch (e) {
    console.error("[fileParser] Word parse error:", e);
    throw new Error("Word文档解析失败，请确认文件格式为.docx");
  }
}

// ─── Excel 解析 ───────────────────────────────────────────────────

async function parseExcel(buffer: Buffer): Promise<string> {
  try {
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(buffer, { type: "buffer" });

    const lines: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (csv.trim()) {
        lines.push(`=== 工作表：${sheetName} ===`);
        lines.push(csv.trim());
      }
    }

    return lines.join("\n\n").trim();
  } catch (e) {
    console.error("[fileParser] Excel parse error:", e);
    throw new Error("Excel文件解析失败，请确认文件格式正确");
  }
}

// ─── CSV 解析 ─────────────────────────────────────────────────────

function parseCsv(buffer: Buffer): string {
  return buffer.toString("utf-8").trim();
}

// ─── PowerPoint 解析 ──────────────────────────────────────────────

async function parsePowerPoint(buffer: Buffer): Promise<string> {
  try {
    // 使用 adm-zip 提取 PPTX 文件内容
    const AdmZip = await import("adm-zip");
    const zip = new (AdmZip as any).default(buffer);
    const entries = zip.getEntries();

    const lines: string[] = [];
    let slideNum = 0;

    for (const entry of entries) {
      if (entry.entryName.includes("slide") && entry.entryName.endsWith(".xml") && !entry.entryName.includes("slideLayout")) {
        slideNum++;
        lines.push(`=== 幻灯片 ${slideNum} ===`);
        const content = entry.getData().toString("utf-8");
        // 从 XML 中提取文本
        const textMatches = content.match(/<a:t>([^<]+)<\/a:t>/g) || [];
        for (const match of textMatches) {
          const text = match.replace(/<a:t>|<\/a:t>/g, "");
          if (text.trim()) {
            lines.push(text);
          }
        }
        lines.push("");
      }
    }

    return lines.join("\n").trim() || "PowerPoint 文件内容为空";
  } catch (e) {
    console.error("[fileParser] PowerPoint parse error:", e);
    throw new Error("PowerPoint 文件解析失败，请确认文件格式为 .pptx");
  }
}

// ─── 图片 OCR（AI视觉识别） ────────────────────────────────────────

async function parseImage(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    // 上传图片到S3，获取URL供AI访问
    const key = `knowledge-uploads/${nanoid()}.${mimeType.split("/")[1] || "jpg"}`;
    const { url } = await storagePut(key, buffer, mimeType);

    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "你是一个专业的文字识别和内容提取助手。请从图片中提取所有可见的文字内容，保持原有的段落结构和格式。如果图片包含表格，请用文字描述表格内容。输出纯文本，不需要额外解释。",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url, detail: "high" },
            },
            {
              type: "text",
              text: "请提取图片中的所有文字内容，保持原有结构和格式：",
            },
          ],
        },
      ],
    });

    const text = result.choices[0]?.message?.content;
    if (typeof text === "string") return text.trim();
    return "图片内容识别完成，但未能提取到文字";
  } catch (e) {
    console.error("[fileParser] Image OCR error:", e);
    throw new Error("图片文字识别失败，请确认图片清晰可读");
  }
}

// ─── 路由 ─────────────────────────────────────────────────────────

export const fileParserRouter = router({
  /**
   * 解析上传的文件，提取文本内容
   * 接收 base64 编码的文件数据
   */
  parse: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1),
        mimeType: z.string().min(1),
        /** base64 编码的文件内容 */
        data: z.string().min(1),
        /** 文件大小（字节），用于校验 */
        size: z.number().int().positive(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // 仅管理员可使用文件解析
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "仅管理员可上传文件" });
      }

      // 文件大小限制：30MB
      const MAX_SIZE = 30 * 1024 * 1024;
      if (input.size > MAX_SIZE) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "文件大小不能超过30MB",
        });
      }

      const fileType = detectFileType(input.filename, input.mimeType);

      if (fileType === "unknown") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "不支持的文件格式，请上传 PDF、Word、Excel、CSV、PowerPoint 或图片文件",
        });
      }

      // 解码 base64 数据
      const buffer = Buffer.from(input.data, "base64");

      let extractedText = "";

      switch (fileType) {
        case "pdf":
          extractedText = await parsePdf(buffer);
          break;
        case "word":
          extractedText = await parseWord(buffer);
          break;
        case "excel":
          extractedText = await parseExcel(buffer);
          break;
        case "csv":
          extractedText = parseCsv(buffer);
          break;
        case "ppt":
          extractedText = await parsePowerPoint(buffer);
          break;
        case "image":
          extractedText = await parseImage(buffer, input.mimeType);
          break;
        case "text":
          extractedText = buffer.toString("utf-8").trim();
          break;
      }

      if (!extractedText) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "文件内容为空，无法提取文字",
        });
      }

      // 截断超长内容（知识库单条上限 50000 字）
      const MAX_CONTENT = 50000;
      const truncated = extractedText.length > MAX_CONTENT;
      const finalText = truncated
        ? extractedText.slice(0, MAX_CONTENT) + "\n\n[内容已截断，原文件超过50000字]"
        : extractedText;

      return {
        success: true,
        fileType,
        filename: input.filename,
        extractedText: finalText,
        charCount: finalText.length,
        truncated,
      };
    }),
});
