import Foundation
import Vision
import ImageIO

struct OCRLine: Encodable {
    let text: String
    let x: Double
    let y: Double
    let width: Double
    let height: Double
    let confidence: Float
}

func fail(_ message: String) -> Never {
    FileHandle.standardError.write((message + "\n").data(using: .utf8)!)
    exit(1)
}

guard CommandLine.arguments.count >= 2 else {
    fail("Usage: daggerheart_ocr.swift image-path")
}

let imageURL = URL(fileURLWithPath: CommandLine.arguments[1])
guard let imageSource = CGImageSourceCreateWithURL(imageURL as CFURL, nil),
      let cgImage = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
    fail("Could not load image: \(imageURL.path)")
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
request.minimumTextHeight = 0.008
request.revision = VNRecognizeTextRequestRevision3

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
do {
    try handler.perform([request])
} catch {
    fail("OCR failed: \(error)")
}

let lines: [OCRLine] = (request.results ?? []).compactMap { observation in
    guard let candidate = observation.topCandidates(1).first else { return nil }
    let box = observation.boundingBox
    return OCRLine(
        text: candidate.string,
        x: box.origin.x,
        y: 1.0 - box.origin.y - box.height,
        width: box.width,
        height: box.height,
        confidence: candidate.confidence
    )
}.sorted {
    if abs($0.y - $1.y) > 0.012 { return $0.y < $1.y }
    return $0.x < $1.x
}

let data = try JSONEncoder().encode(lines)
FileHandle.standardOutput.write(data)
