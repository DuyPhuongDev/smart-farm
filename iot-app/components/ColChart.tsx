interface data {
  value: number;
  time: string;
}
interface Props {
  data: data[];
}
import { BarChart } from "react-native-gifted-charts";

export default function ColChart(props: Props) {
  return (
    <BarChart
      data={props.data}
      isAnimated={true}
      frontColor="rgb(46, 217, 255)"
      barWidth={30} // Độ rộng của cột
      spacing={20} // Khoảng cách giữa các cột
      xAxisLabelTexts={props.data.map((data) => data.time)}
    />
  );
}
