'use client'
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RefreshCw, ZoomIn, Search, Calculator, AlertCircle } from 'lucide-react';

// --- HELPER: Script Loader ---
const useExternalScripts = (urls) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadScript = (url) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = resolve;
        script.onerror = reject;
        document.body.appendChild(script);
      });
    };

    Promise.all(urls.map(loadScript))
      .then(() => setLoaded(true))
      .catch((err) => console.error("Script load error:", err));
  }, [urls]);

  return loaded;
};

// --- HELPER: Algorithms & Math ---

const runNewtonRaphson = (funcStr, initialGuess, iterations = 5) => {
  const steps = [];
  if (!window.math) return { steps, error: "Math library not loaded" };

  try {
    const f = window.math.compile(funcStr);
    const df = window.math.derivative(funcStr, 'x');
    
    let x = parseFloat(initialGuess);
    if (isNaN(x)) return { steps, error: "Invalid initial guess" };

    for (let i = 0; i < iterations; i++) {
      let y, slope;
      try {
        y = f.evaluate({ x });
        slope = df.evaluate({ x });
      } catch (mathErr) {
        return { steps, error: "Error evaluating function. Check syntax." };
      }
      
      if (!isFinite(y) || !isFinite(slope)) break;
      if (Math.abs(slope) < 1e-9) return { steps, error: "Derivative is zero. Method failed." };
      
      const x_next = x - (y / slope);
      
      // Tangent line: y - y0 = m(x - x0) => y = mx + (y0 - m*x0)
      const c = y - (slope * x);
      const tangentFn = `${slope} * x + (${c})`;

      steps.push({
        method: 'newton',
        iter: i + 1,
        x_current: x,
        y_current: y,
        x_next: x_next,
        tangentFn: tangentFn
      });

      if (!isFinite(x_next)) break;
      x = x_next;
    }
    return { steps, error: null };
  } catch (e) {
    return { steps, error: "Invalid function syntax." };
  }
};

const runBisection = (funcStr, aVal, bVal, iterations = 5) => {
  const steps = [];
  if (!window.math) return { steps, error: "Math library not loaded" };

  try {
    const f = window.math.compile(funcStr);
    let a = parseFloat(aVal);
    let b = parseFloat(bVal);

    if (isNaN(a) || isNaN(b)) return { steps, error: "Invalid bounds" };

    const fa_init = f.evaluate({ x: a });
    const fb_init = f.evaluate({ x: b });

    if (fa_init * fb_init > 0) {
      return { 
        steps: [], 
        error: `Root is not bracketed! f(${a}) and f(${b}) must have opposite signs.` 
      };
    }

    for (let i = 0; i < iterations; i++) {
      const fa = f.evaluate({ x: a });
      const midpoint = (a + b) / 2;
      const fmid = f.evaluate({ x: midpoint });

      steps.push({
        method: 'bisection',
        iter: i + 1,
        a: a,
        b: b,
        mid: midpoint,
        fmid: fmid
      });

      if (Math.abs(fmid) < 1e-9) break; // Found root

      if (fa * fmid < 0) {
        b = midpoint;
      } else {
        a = midpoint;
      }
    }
    return { steps, error: null };
  } catch (e) {
    return { steps, error: "Error evaluating function." };
  }
};

const runSecant = (funcStr, x0Val, x1Val, iterations = 5) => {
  const steps = [];
  if (!window.math) return { steps, error: "Math library not loaded" };

  try {
    const f = window.math.compile(funcStr);
    let x0 = parseFloat(x0Val);
    let x1 = parseFloat(x1Val);

    if (isNaN(x0) || isNaN(x1)) return { steps, error: "Invalid initial guesses" };

    for (let i = 0; i < iterations; i++) {
      const y0 = f.evaluate({ x: x0 });
      const y1 = f.evaluate({ x: x1 });

      if (Math.abs(y1 - y0) < 1e-9) return { steps, error: "Division by zero (f(x1) ≈ f(x0))" };

      const x_new = x1 - (y1 * (x1 - x0)) / (y1 - y0);
      
      // Secant line passes through (x0, y0) and (x1, y1)
      const slope = (y1 - y0) / (x1 - x0);
      const c = y1 - slope * x1;
      const lineFn = `${slope} * x + (${c})`;

      steps.push({
        method: 'secant',
        iter: i + 1,
        x0: x0,
        x1: x1,
        y0: y0,
        y1: y1,
        x_new: x_new,
        lineFn: lineFn
      });

      if (!isFinite(x_new)) break;
      
      // Shift for next iteration
      x0 = x1;
      x1 = x_new;
    }
    return { steps, error: null };
  } catch (e) {
    return { steps, error: "Error evaluating function." };
  }
};

const runFalsePosition = (funcStr, aVal, bVal, iterations = 5) => {
  const steps = [];
  if (!window.math) return { steps, error: "Math library not loaded" };

  try {
    const f = window.math.compile(funcStr);
    let a = parseFloat(aVal);
    let b = parseFloat(bVal);

    if (isNaN(a) || isNaN(b)) return { steps, error: "Invalid bounds" };

    let fa = f.evaluate({ x: a });
    let fb = f.evaluate({ x: b });

    if (fa * fb > 0) {
      return { 
        steps: [], 
        error: `Root is not bracketed! f(${a}) and f(${b}) must have opposite signs.` 
      };
    }

    for (let i = 0; i < iterations; i++) {
      fa = f.evaluate({ x: a });
      fb = f.evaluate({ x: b });
      
      // Formula: c = (a*f(b) - b*f(a)) / (f(b) - f(a))
      const c = (a * fb - b * fa) / (fb - fa);
      const fc = f.evaluate({ x: c });

      // Chord line equation for visualization
      const slope = (fb - fa) / (b - a);
      const intercept = fb - slope * b;
      const lineFn = `${slope} * x + (${intercept})`;

      steps.push({
        method: 'falsePosition',
        iter: i + 1,
        a: a,
        b: b,
        c: c,
        fc: fc,
        lineFn: lineFn
      });

      if (Math.abs(fc) < 1e-9) break;

      if (fc * fa < 0) {
        b = c;
      } else {
        a = c;
      }
    }
    return { steps, error: null };
  } catch (e) {
    return { steps, error: "Error evaluating function." };
  }
};

// --- COMPONENTS ---

const FunctionPlotter = ({ 
  func, 
  algoSteps, 
  stepIndex, 
  xDomain, 
  yDomain, 
  setXDomain, 
  setYDomain 
}) => {
  const plotRef = useRef(null);

  const autoScaleY = useCallback(() => {
    if (!window.math) return;
    try {
      const f = window.math.compile(func);
      let minY = Infinity;
      let maxY = -Infinity;
      const range = xDomain[1] - xDomain[0];
      const step = range / 20;
      if (range <= 0) return; 

      for (let x = xDomain[0]; x <= xDomain[1]; x += step) {
        const y = f.evaluate({ x });
        if (isFinite(y) && Math.abs(y) < 10000) { 
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
      if (minY === Infinity || maxY === -Infinity) { minY = -10; maxY = 10; }
      let padding = (maxY - minY) * 0.2 || 5;
      setYDomain([minY - padding, maxY + padding]);
    } catch (e) { setYDomain([-10, 10]); }
  }, [func, xDomain, setYDomain]);

  useEffect(() => {
    if (!plotRef.current || !window.functionPlot || !window.math) return;
    if (!func || !func.trim()) return;

    try {
      const width = plotRef.current.clientWidth;
      const height = plotRef.current.clientHeight;

      let data = [
        {
          fn: func,
          sampler: 'builtIn',
          graphType: 'polyline',
          color: '#2563eb'
        }
      ];

      // --- VISUALIZATION LOGIC ---
      if (algoSteps.length > 0 && stepIndex >= 0 && stepIndex < algoSteps.length) {
        const currentStep = algoSteps[stepIndex];

        // 1. NEWTON RAPHSON
        if (currentStep.method === 'newton') {
          if (currentStep.tangentFn) {
            data.push({
              fn: currentStep.tangentFn,
              graphType: 'polyline',
              color: '#ef4444',
              attr: { "stroke-dasharray": "5,5" }
            });
          }
          data.push({
            points: [[currentStep.x_current, currentStep.y_current]],
            fnType: 'points',
            graphType: 'scatter',
            color: '#ef4444',
            attr: { r: 5 }
          });
          if (isFinite(currentStep.x_next)) {
            data.push({
              points: [[currentStep.x_next, 0]],
              fnType: 'points',
              graphType: 'scatter',
              color: '#10b981',
              attr: { r: 5 }
            });
          }
        } 
        // 2. BISECTION
        else if (currentStep.method === 'bisection') {
          data.push({
            fn: `1000 * (x - ${currentStep.a})`, 
            fnType: 'implicit',
            color: 'rgba(255, 165, 0, 0.3)'
          });
           data.push({
            fn: `1000 * (x - ${currentStep.b})`, 
            fnType: 'implicit',
            color: 'rgba(255, 165, 0, 0.3)'
          });
          data.push({
            points: [
              [currentStep.a, 0], [currentStep.b, 0], [currentStep.mid, 0]
            ],
            fnType: 'points',
            graphType: 'scatter',
            color: '#f59e0b',
            attr: { r: 6 }
          });
        }
        // 3. SECANT
        else if (currentStep.method === 'secant') {
          // Secant Line
          if (currentStep.lineFn) {
             data.push({
              fn: currentStep.lineFn,
              graphType: 'polyline',
              color: '#8b5cf6', // Purple
              attr: { "stroke-dasharray": "5,5" }
            });
          }
          // Points: (x0, y0), (x1, y1), (x_new, 0)
          data.push({
            points: [
              [currentStep.x0, currentStep.y0],
              [currentStep.x1, currentStep.y1]
            ],
            fnType: 'points',
            graphType: 'scatter',
            color: '#8b5cf6',
            attr: { r: 5 }
          });
          if (isFinite(currentStep.x_new)) {
             data.push({
              points: [[currentStep.x_new, 0]],
              fnType: 'points',
              graphType: 'scatter',
              color: '#10b981', // Green result
              attr: { r: 5 }
            });
          }
        }
        // 4. FALSE POSITION (Regula Falsi)
        else if (currentStep.method === 'falsePosition') {
          // Chord Line
          if (currentStep.lineFn) {
            data.push({
              fn: currentStep.lineFn,
              graphType: 'polyline',
              color: '#ec4899', // Pink
              attr: { "stroke-dasharray": "5,5" }
            });
          }
          // Points: (a, fa), (b, fb), (c, 0)
          data.push({
            points: [
              [currentStep.a, 0], // Marker on x-axis
              [currentStep.b, 0],
              [currentStep.c, 0]  // The root estimate
            ],
            fnType: 'points',
            graphType: 'scatter',
            color: '#ec4899',
            attr: { r: 6 }
          });
        }
      }

      window.functionPlot({
        target: plotRef.current,
        width: width,
        height: height,
        grid: true,
        tip: { xLine: true, yLine: true },
        xAxis: { domain: xDomain, label: 'x' },
        yAxis: { domain: yDomain, label: 'f(x)' },
        data: data
      });
    } catch (e) {
      console.log('Plotting skipped due to error:', e);
    }
  }, [func, xDomain, yDomain, algoSteps, stepIndex]);

  return (
    <div className="relative w-full h-full group">
      <div ref={plotRef} className="w-full h-96 bg-white rounded-lg shadow-inner border border-slate-200 overflow-hidden" />
      <button 
        onClick={autoScaleY}
        className="absolute top-2 right-2 bg-white/90 p-2 rounded shadow hover:bg-blue-50 text-blue-600 transition-colors border border-blue-100"
        title="Auto-Fit Y Axis"
      >
        <ZoomIn size={20} />
      </button>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

const App = () => {
  const libsLoaded = useExternalScripts([
    "https://cdnjs.cloudflare.com/ajax/libs/mathjs/12.4.0/math.js",
    "https://unpkg.com/function-plot/dist/function-plot.js"
  ]);

  const [funcStr, setFuncStr] = useState('x^2 - 4');
  const [method, setMethod] = useState('newton'); // 'newton', 'bisection', 'secant', 'falsePosition'
  
  // Inputs
  const [initialGuess, setInitialGuess] = useState('3'); // Newton
  const [boundA, setBoundA] = useState('0'); // Bisection, False Position, Secant (x0)
  const [boundB, setBoundB] = useState('5'); // Bisection, False Position, Secant (x1)
  
  // Visualization State
  const [xDomain, setXDomain] = useState([-10, 10]);
  const [yDomain, setYDomain] = useState([-10, 10]);
  const [steps, setSteps] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleMethodChange = (newMethod) => {
    setMethod(newMethod);
    setSteps([]);
    setErrorMsg(null);
    setCurrentStepIndex(-1);
    setIsPlaying(false);
  };

  const handleCalculate = () => {
    if (!libsLoaded) return;
    setErrorMsg(null);
    
    let result = { steps: [], error: null };

    if (method === 'newton') {
      result = runNewtonRaphson(funcStr, initialGuess);
    } else if (method === 'bisection') {
      result = runBisection(funcStr, boundA, boundB);
    } else if (method === 'secant') {
      result = runSecant(funcStr, boundA, boundB); // Reusing A/B as x0/x1
    } else if (method === 'falsePosition') {
      result = runFalsePosition(funcStr, boundA, boundB);
    }
    
    if (result.error) {
      setErrorMsg(result.error);
      setSteps([]);
    } else {
      setSteps(result.steps);
      setCurrentStepIndex(0);
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    let interval;
    if (isPlaying && steps.length > 0 && currentStepIndex < steps.length - 1) {
      interval = setInterval(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, 1000);
    } else if (currentStepIndex >= steps.length - 1) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStepIndex, steps]);

  if (!libsLoaded) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 text-slate-500 animate-pulse">
        Loading math libraries...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Controls */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-4">
            <Calculator className="text-blue-600" />
            <h1 className="text-xl font-bold">Root Finder Visualizer</h1>
          </div>

          {/* Function Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-500">Function f(x)</label>
            <div className="relative">
              <input 
                type="text" 
                value={funcStr} 
                onChange={(e) => setFuncStr(e.target.value)}
                className="w-full p-3 pl-10 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-lg"
                placeholder="e.g. x^2 - 4"
              />
              <span className="absolute left-3 top-3.5 text-slate-400">f(x)=</span>
            </div>
          </div>

          {/* Method Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-500">Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleMethodChange('newton')} className={`p-2 rounded-lg text-xs font-bold transition-colors ${method === 'newton' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Newton-Raphson</button>
              <button onClick={() => handleMethodChange('bisection')} className={`p-2 rounded-lg text-xs font-bold transition-colors ${method === 'bisection' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Bisection</button>
              <button onClick={() => handleMethodChange('secant')} className={`p-2 rounded-lg text-xs font-bold transition-colors ${method === 'secant' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Secant Method</button>
              <button onClick={() => handleMethodChange('falsePosition')} className={`p-2 rounded-lg text-xs font-bold transition-colors ${method === 'falsePosition' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>False Position</button>
            </div>
          </div>

          {/* Dynamic Inputs */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4">
            {method === 'newton' ? (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wide font-bold text-slate-400">Initial Guess (x₀)</label>
                <input type="number" value={initialGuess} onChange={(e) => setInitialGuess(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide font-bold text-slate-400">
                    {method === 'secant' ? 'First Guess (x₀)' : 'Lower Bound (a)'}
                  </label>
                  <input type="number" value={boundA} onChange={(e) => setBoundA(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-wide font-bold text-slate-400">
                    {method === 'secant' ? 'Second Guess (x₁)' : 'Upper Bound (b)'}
                  </label>
                  <input type="number" value={boundB} onChange={(e) => setBoundB(e.target.value)} className="w-full p-2 border border-slate-300 rounded focus:border-blue-500 outline-none" />
                </div>
              </div>
            )}
            
            <button onClick={handleCalculate} className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-lg font-medium transition-transform active:scale-95">
              <Search size={18} />
              <span>Calculate Roots</span>
            </button>
          </div>

          {/* Error Message Display */}
          {errorMsg && (
            <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Results Table */}
          {steps.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-500">Iterations</label>
              <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg text-sm">
                <table className="w-full text-left bg-white">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="p-2 border-b">It</th>
                      <th className="p-2 border-b">Root Est.</th>
                      <th className="p-2 border-b">Value f(x)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {steps.map((step, idx) => {
                      let xVal, yVal;
                      if (step.method === 'newton') { xVal = step.x_next; yVal = step.y_current; }
                      else if (step.method === 'secant') { xVal = step.x_new; yVal = step.y1; } // y1 is f(x_new) of previous step effectively
                      else if (step.method === 'falsePosition' || step.method === 'bisection') { xVal = step.method === 'bisection' ? step.mid : step.c; yVal = step.method === 'bisection' ? step.fmid : step.fc; }
                      
                      return (
                        <tr key={idx} className={`cursor-pointer transition-colors ${idx === currentStepIndex ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-slate-50'}`} onClick={() => setCurrentStepIndex(idx)}>
                          <td className="p-2 border-b font-mono text-slate-500">{step.iter}</td>
                          <td className="p-2 border-b font-mono">{xVal != null ? xVal.toFixed(4) : '-'}</td>
                          <td className="p-2 border-b font-mono text-slate-400">{yVal != null ? Math.abs(yVal) : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Visualizer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <FunctionPlotter func={funcStr} algoSteps={steps} stepIndex={currentStepIndex} xDomain={xDomain} yDomain={yDomain} setXDomain={setXDomain} setYDomain={setYDomain} />
            
            {/* Playback Controls */}
            {steps.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div className="flex items-center space-x-4">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium">
                    {isPlaying ? <><span>Pause</span></> : <><Play size={16} /><span>Animate Steps</span></>}
                  </button>
                  <span className="text-sm text-slate-500">Step {(currentStepIndex >= 0 ? currentStepIndex : 0) + 1} of {steps.length}</span>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => setCurrentStepIndex(0)} className="p-2 text-slate-400 hover:text-slate-600" title="Reset"><RefreshCw size={18} /></button>
                </div>
              </div>
            )}
          </div>
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
            <strong>Usage Tip:</strong> Try finding roots for <code>x^3 - x - 2</code>. For Bisection/False Position, try bounds [1, 2].
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;