interface data {
    value:number,
    time:string
}
interface Props{
    data:data[]
}
import { LineChart } from "react-native-gifted-charts";
export default function Chart(props : Props){
    return (
        <LineChart
                  areaChart
                  data={props.data}
                  curved={true}
                  isAnimated={true}
                  animateOnDataChange={true}
                  hideDataPoints={true}
                  startFillColor="rgb(46, 217, 255)"
                  startOpacity={0.8}
                  endFillColor="rgb(203, 241, 250)"
                  endOpacity={0.3}
                  spacing={50}
                  stepHeight={27}
                  xAxisLabelTexts={props.data.map((data) => data.time)}
        />
    )
}