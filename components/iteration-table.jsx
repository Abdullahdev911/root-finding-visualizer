"use client"



export default function IterationTable({ data, currentIteration }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Iteration Data</h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Iteration #</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">xₙ (Estimate)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">f(xₙ) (Value)</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Error (|xₙ - xₙ₋₁|)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={idx}
                className={`border-b border-gray-200 ${
                  idx === currentIteration ? "bg-blue-50" : idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                }`}
              >
                <td className="px-4 py-3 font-medium text-gray-900">{row.iteration}</td>
                <td className="px-4 py-3 font-mono text-gray-700">{row.x.toFixed(6)}</td>
                <td className="px-4 py-3 font-mono text-gray-700">{row.fx.toFixed(6)}</td>
                <td className="px-4 py-3 font-mono text-gray-700">{row.error.toFixed(6)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
