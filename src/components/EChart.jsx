import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export default function EChart({ option, theme, style, onChartClick }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
    }

    const activeTheme = theme === 'dark' ? 'dark' : null;

    chartInstanceRef.current = echarts.init(chartRef.current, activeTheme, {
      renderer: 'svg'
    });

    if (option) {
      chartInstanceRef.current.setOption(option);
    }

    chartInstanceRef.current.on('click', (params) => {
      if (onChartClick) {
        onChartClick(params);
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.resize();
      }
    });

    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, [theme]);

  useEffect(() => {
    if (chartInstanceRef.current && option) {
      chartInstanceRef.current.setOption(option, true);
    }
  }, [option]);

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '220px',
        ...style
      }}
    />
  );
}
