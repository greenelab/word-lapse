import { useContext } from "react";
import {
  XYChart,
  Axis,
  LineSeries,
  AreaSeries,
  GlyphSeries,
} from "@visx/xychart";
import { curveCatmullRom } from "@visx/curve";
import { Text } from "@visx/text";
import { purple, lightPurple, darkGray } from "./palette";
import { AppContext } from "./App";

const Timeline = ({ width, height }) => {
  const { search, results } = useContext(AppContext);
  const { frequency_timeline: data } = results;

  return (
    <XYChart
      width={width || 200}
      height={height || 200}
      xScale={{ type: "band" }}
      yScale={{ type: "linear" }}
      margin={{ left: 120, top: 80, bottom: 80, right: 40 }}
    >
      <AreaSeries
        data={data}
        xAccessor={(d) => d.year}
        yAccessor={(d) => d.frequency}
        curve={curveCatmullRom}
        stroke="none"
        fill={lightPurple}
      />
      <LineSeries
        data={data}
        xAccessor={(d) => d.year}
        yAccessor={(d) => d.frequency}
        curve={curveCatmullRom}
        stroke={purple}
        strokeWidth={3}
      />
      <GlyphSeries
        data={data}
        xAccessor={(d) => d.year}
        yAccessor={(d) => d.frequency}
        size={9}
        colorAccessor={() => purple}
      />
      <Text
        x={width / 2}
        y={50}
        style={{ fontSize: 20, fontWeight: 600 }}
        max={100}
        textAnchor="middle"
      >
        {`How often "${search}" has been used over time`}
      </Text>
      <Axis
        orientation="left"
        label="Frequency of use"
        labelOffset={80}
        labelProps={{
          textAnchor: "middle",
          style: { fontSize: 18, fontWeight: 600 },
        }}
        numTicks={height / 50}
        tickFormat={(value) => value.toExponential()}
        tickLength={10}
        tickLineProps={{
          style: { transform: "scale(0.5, 1)" },
          strokeWidth: 2,
          stroke: darkGray,
        }}
        stroke={darkGray}
        strokeWidth={2}
      />
      <Axis
        orientation="bottom"
        label="Year"
        labelOffset={40}
        labelProps={{
          textAnchor: "middle",
          style: { fontSize: 18, fontWeight: 600 },
        }}
        numTicks={width / 80}
        tickLength={10}
        tickLineProps={{
          style: { transform: "scale(1, 0.5)" },
          strokeWidth: 2,
          stroke: darkGray,
        }}
        stroke={darkGray}
        strokeWidth={2}
      />
    </XYChart>
  );
};

export default Timeline;
