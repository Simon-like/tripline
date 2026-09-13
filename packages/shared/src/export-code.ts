import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, bytesToUtf8, utf8ToBytes } from '@noble/hashes/utils';
import { base64urlnopad } from '@scure/base';
import { z } from 'zod';
import { JourneyBundleSchema, SCHEMA_VERSION, type JourneyBundle } from './schema';

const EnvelopeSchema = z.object({
  schemaVersion: z.number().int().positive(),
  payload: z.unknown(),
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
});

export class ExportCodeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExportCodeError';
  }
}

function checksum(payload: unknown): string {
  return bytesToHex(sha256(utf8ToBytes(JSON.stringify(payload))));
}

export function encodeExportCode(input: JourneyBundle): string {
  const payload = JourneyBundleSchema.parse(input);
  const envelope = {
    schemaVersion: SCHEMA_VERSION,
    payload,
    checksum: checksum(payload),
  };
  return `TL${SCHEMA_VERSION}.${base64urlnopad.encode(utf8ToBytes(JSON.stringify(envelope)))}`;
}

export function decodeExportCode(text: string): JourneyBundle {
  const match = text.match(/TL(\d+)\.([A-Za-z0-9_-]+)/);
  if (!match) throw new ExportCodeError('未识别到旅迹导出码');

  const codeVersion = Number(match[1]);
  if (codeVersion > SCHEMA_VERSION) {
    throw new ExportCodeError('导出码版本比当前应用新，请更新旅迹后再导入');
  }
  if (codeVersion < SCHEMA_VERSION) {
    throw new ExportCodeError('此导出码版本暂不支持，请使用新版导出码');
  }

  try {
    const decoded = base64urlnopad.decode(match[2]);
    if (base64urlnopad.encode(decoded) !== match[2]) throw new ExportCodeError('导出码格式无效或内容已损坏');
    const raw = bytesToUtf8(decoded);
    const envelope = EnvelopeSchema.parse(JSON.parse(raw));
    if (envelope.schemaVersion !== codeVersion) throw new ExportCodeError('导出码版本不一致');
    if (checksum(envelope.payload) !== envelope.checksum) throw new ExportCodeError('导出码校验失败，内容可能已损坏');
    return JourneyBundleSchema.parse(envelope.payload);
  } catch (error) {
    if (error instanceof ExportCodeError) throw error;
    throw new ExportCodeError('导出码格式无效或内容已损坏');
  }
}
