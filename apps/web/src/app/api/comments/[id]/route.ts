import { NextResponse } from "next/server";

import { deleteComment, EditInput, editComment, ERROR_STATUS, PasswordInput } from "@/lib/comments";

const NO_STORE = { "cache-control": "no-store" };

// 비밀번호가 맞으면 고친다
export async function PATCH(request: Request, { params }: RouteContext<"/api/comments/[id]">) {
  const { id } = await params;
  const parsed = EditInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  const result = await editComment(id, parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: ERROR_STATUS[result.error], headers: NO_STORE });
  return NextResponse.json({ comment: result.comment }, { headers: NO_STORE });
}

// 비밀번호가 맞으면 지운다
export async function DELETE(request: Request, { params }: RouteContext<"/api/comments/[id]">) {
  const { id } = await params;
  const parsed = PasswordInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400, headers: NO_STORE });
  const result = await deleteComment(id, parsed.data.password);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: ERROR_STATUS[result.error], headers: NO_STORE });
  return new NextResponse(null, { status: 204, headers: NO_STORE });
}
