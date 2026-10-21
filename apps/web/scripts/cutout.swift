// 사진에서 주인공(제품)만 오려 투명 PNG 로 저장한다. macOS 14+ Vision 의 전경 마스크(사진 앱 '주체 들어 올리기'와 같은 기능).
// 사용: swift cutout.swift <입력> <출력.png>
import AppKit
import CoreImage
import Vision

let args = CommandLine.arguments
guard args.count == 3 else { FileHandle.standardError.write("사용: cutout <입력> <출력.png>\n".data(using: .utf8)!); exit(2) }
let input = URL(fileURLWithPath: args[1]), output = URL(fileURLWithPath: args[2])
guard let ci = CIImage(contentsOf: input, options: [.applyOrientationProperty: true]) else { print("읽기 실패"); exit(1) }
let handler = VNImageRequestHandler(ciImage: ci)
let req = VNGenerateForegroundInstanceMaskRequest()
do { try handler.perform([req]) } catch { print("Vision 실패: \(error)"); exit(1) }
guard let obs = req.results?.first, !obs.allInstances.isEmpty else { print("주체 없음"); exit(3) }
// 가장 큰 인스턴스만이 아니라 전체 전경(손에 든 경우 손도 포함될 수 있다 — 사람이 걸러 낸다)
let buf = try obs.generateMaskedImage(ofInstances: obs.allInstances, from: handler, croppedToInstancesExtent: true)
let out = CIImage(cvPixelBuffer: buf)
let ctx = CIContext()
guard let cg = ctx.createCGImage(out, from: out.extent) else { print("변환 실패"); exit(1) }
let rep = NSBitmapImageRep(cgImage: cg)
try rep.representation(using: .png, properties: [:])!.write(to: output)
print("ok \(cg.width)x\(cg.height) instances=\(obs.allInstances.count)")
