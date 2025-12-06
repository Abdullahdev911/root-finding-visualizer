
import React, { useEffect, useRef } from 'react';
import functionPlot from 'function-plot';

const FunctionPlotter = ({ func, domain = [-20, 20], xDomain = [-20, 20], yDomain = [-20, 20] }) => {
  const plotRef = useRef(null);

  useEffect(() => {
    try{
    if (plotRef.current) {

      functionPlot({
        target: plotRef.current,
        width: 1000,
        height: 500,
        grid: true,
        xAxis: { domain: xDomain },
        yAxis: { domain: yDomain },
        data: [{
          fn: func,
          xDomain: xDomain,
          yDomain: yDomain
        }]
      });
    }
    }
    catch(e){
      console.log('proper mathematical function needed')
    }
    
  }, [func, xDomain, yDomain]);

  return <div ref={plotRef}></div>;
};

const GraphVisualizer = ({functionStr, xDomain = [-20, 20], yDomain = [-20, 20]}) => {
  return (
    <div className='w-full flex flex-col items-center'>
      <h1>Mathematical Function Plotter</h1>
      <FunctionPlotter func={functionStr} xDomain={xDomain} yDomain={yDomain} />
    </div>
  );
};

export default GraphVisualizer;