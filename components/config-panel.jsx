"use client"

export default function ConfigPanel({
  functionStr,
  setFunctionStr,
  method,
  setMethod,
  x0,
  setX0,
  maxIterations,
  setMaxIterations,
  tolerance,
  setTolerance,
  onRunMethod,
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-lg font-semibold text-gray-900">Configuration</h2>

      {/* Function Input */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">f(x) =</label>
        <input
          type="text"
          value={functionStr}
          onChange={(e) => setFunctionStr(e.target.value)}
          placeholder="e.g., x^3 - 2*x - 5"
          className="w-full rounded-lg border border-gray-300 px-4 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      {/* Numerical Method */}
      <div className="mb-6">
        <label className="mb-2 block text-sm font-semibold text-gray-900">Numerical Method</label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option>Newton-Raphson</option>
          <option>Bisection</option>
          <option>Secant</option>
        </select>
      </div>

      {/* Parameters */}
      <div className="mb-8">
        <h3 className="mb-4 font-semibold text-gray-900">Parameters</h3>

        <div className="space-y-4">
          {/* Initial Guess */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Initial Guess (x₀)</label>
            <input
              type="number"
              value={x0}
              onChange={(e) => setX0(Number.parseFloat(e.target.value))}
              step="0.1"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Max Iterations */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Max Iterations</label>
            <input
              type="number"
              value={maxIterations}
              onChange={(e) => setMaxIterations(Number.parseInt(e.target.value))}
              min="1"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {/* Tolerance */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tolerance (ε)</label>
            <input
              type="number"
              value={tolerance}
              onChange={(e) => setTolerance(Number.parseFloat(e.target.value))}
              step="0.00001"
              min="0"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="space-y-3">
        <button
          onClick={onRunMethod}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Run Method
        </button>
        <button className="w-full rounded-lg border-2 border-indigo-600 px-4 py-2 font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors">
          Compare All Methods
        </button>
      </div>
    </div>
  )
}
