import { NextResponse } from "next/server";

import { isRecordId } from "@/lib/api-guard";
import { deleteComment, EditInput, editComment, ERROR_STATUS, PasswordInput } from "@/lib/comments";

const NO_STORE = { "cache-control": "no-store" };

// 비밀번호가 맞으면 고친다. PATCH·DELETE 는 다른 사이트에서 보내면 브라우저가 사전 요청을 먼저 보내고 우리가 허용하지 않아 막힌다 (출처 검사 불필요)
export async function PATCH(request: Request, { params }: RouteContext<"/api/comments/[id]">) {
  const { id } = await params;
  const parsed = EditInput.safeParse(await request.json().catch(() => null));
  if (!isRecordId(id) || !parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  const result = await editComment(id, parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: ERROR_STATUS[result.error], headers: NO_STORE });
  return NextResponse.json({ comment: result.comment }, { headers: NO_STORE });
}

// 비밀번호가 맞으면 지운다
export async function DELETE(request: Request, { params }: RouteContext<"/api/comments/[id]">) {
  const { id } = await params;
  const parsed = PasswordInput.safeParse(await request.json().catch(() => null));
  if (!isRecordId(id) || !parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  const result = await deleteComment(id, parsed.data.password);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: ERROR_STATUS[result.error], headers: NO_STORE });
  return new NextResponse(null, { status: 204, headers: NO_STORE });
}
