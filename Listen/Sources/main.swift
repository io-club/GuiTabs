// The Swift Programming Language
// https://docs.swift.org/swift-book

import Foundation
import Numerics

// Compute bit-reversed index for an array of length `count` (power of two)
@inline(__always)
func bitReverseIndex(_ n: Int, count: Int) -> Int {
    let bound = Int(log2(Float(count)))
    var bits = 0
    var v = n
    for i in 0..<bound {
        bits = bits | (v & 1)
        if i != bound - 1 {
            v = v >> 1
            bits = bits << 1
        }
    }
    return bits
}

extension Array where Element: SignedInteger {
    func bitwiseReversed() -> Self {

        func reverseBits(_ n: Int, maxNumber: Int) -> Int {
            let bound = Int(log2(Float(maxNumber)))
            var bits = 0
            var n = n

            for i in 0..<bound {
                bits = bits | (n & 1)
                if i != bound - 1 {
                    n = n >> 1
                    bits = bits << 1
                }
            }

            return bits
        }

        var result = Array.init(unsafeUninitializedCapacity: self.count) {
            buffer,
            count in
            buffer.initialize(repeating: 0)
            count = self.count
        }

        for i in 0..<count {
            result[i] = self[reverseBits(i, maxNumber: count)]
        }

        return result
    }
}

extension Real {
    // The real and imaginary parts of e^{-2πik/n}
    static func dftWeight(k: Int, n: Int) -> Complex<Self> {
        precondition(0 <= k && k < n, "k is out of range")
        guard let N = Self(exactly: n) else {
            preconditionFailure("n cannot be represented exactly.")
        }
        let theta = -2 * .pi * (Self(k) / N)
        return .init(.cos(theta), .sin(theta))
    }
}

struct DFTReadout: Codable {
    let frequency: Float
    let magnitude: Float
}

@_expose(wasm, "dft")
@_cdecl("dft")
func dft(
    ptr: UnsafePointer<Int16>,
    count: Int,
    f_ptr: UnsafeMutablePointer<Float>,
    m_ptr: UnsafeMutablePointer<Float>,
    r_len: UnsafeMutablePointer<Int16>
) {
    let array = Array.init(UnsafeBufferPointer(start: ptr, count: count))
    if array.count < 2 {
        preconditionFailure("Array length must be equal or greater than 2")
    }
    if abs(log2(Float(array.count)).remainder(dividingBy: 1))
        > .leastNonzeroMagnitude
    {
        preconditionFailure("Array length must be a power of 2")
    }

    let N = array.count
    // Hann window coefficients (time-domain)
    let window: [Float] = (0..<N).map { n in
        0.5 * (1 - cos(2 * .pi * Float(n) / Float(N - 1)))
    }
    // Remove DC offset to avoid biasing the lowest bin
    let mean: Float = array.reduce(0) { acc, v in acc + Float(v) } / Float(N)
    // Place windowed samples into bit-reversed order expected by the in-place FFT
    var partitioned = [Complex<Float>](repeating: .init(0, 0), count: N)
    for i in 0..<N {
        let dst = bitReverseIndex(i, count: N)
        let sample = (Float(array[i]) - mean) * window[i]
        partitioned[dst] = Complex<Float>(sample, 0)
    }

    var len = 2
    while len <= array.count {
        let half = len / 2

        for start in stride(from: 0, to: array.count, by: len) {
            for k in 0..<half {
                let top = partitioned[start + k]
                let bottom = partitioned[start + k + half]
                let product = Float.dftWeight(k: k, n: len) * bottom

                partitioned[start + k] = top + product
                partitioned[start + k + half] = top - product
            }
        }

        len *= 2
    }

    partitioned = .init(partitioned[0..<partitioned.count / 2])

    var readouts: [DFTReadout] = []
    readouts.reserveCapacity(partitioned.count)
    for k in 0..<partitioned.count {
        // Real FFT amplitude scaling: DC is 1/N, others are 2/N
        let scale: Float = (k == 0) ? (1.0 / Float(N)) : (2.0 / Float(N))
        let c = partitioned[k]
        let mag: Float = sqrt(c.real * c.real + c.imaginary * c.imaginary) * scale
        readouts.append(.init(frequency: Float(k) / Float(N), magnitude: mag))
    }

    // Write all bins; filtering can be done on the caller side using max magnitude
    r_len.pointee = .init(readouts.count)

    var f_now = f_ptr
    var m_now = m_ptr
    for readout in readouts {
        f_now.pointee = readout.frequency
        m_now.pointee = readout.magnitude
        f_now = f_now.advanced(by: 1)
        m_now = m_now.advanced(by: 1)
    }
}
