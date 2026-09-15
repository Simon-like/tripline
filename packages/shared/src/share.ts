import type { Journey } from './schema';

/** 分享文案关键词：接收端与导入识别均以此为准，改动需同步测试 */
export const SHARE_KEYWORD = '旅迹';
export const SHARE_COPY_HINT = '复制这段文字';

/**
 * 生成类拼多多风格分享文案：旅程名 + 日期 + 关键词引导 + 导出码独占一行。
 * 整段可直接粘贴微信；接收端粘贴整段文字即可被 decodeExportCode 自动识别。
 */
export function buildShareText(journey: Journey, code: string): string {
  return [
    `【${SHARE_KEYWORD}】我把「${journey.name}」的整趟旅程分享给你`,
    `📅 ${journey.startDate} — ${journey.endDate}`,
    `${SHARE_COPY_HINT}，打开${SHARE_KEYWORD}点「导入」，清单、行程、账本、手账全都带过去`,
    code,
  ].join('\n');
}
