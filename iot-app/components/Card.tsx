import { View , Text, StyleSheet} from "react-native";

interface Props {
    data: number,
    unit:string,
    title:string,
    color:string
}
export default function Card(props : Props){
    const date = new Date()
    return(
        <View style={styles.card}>
            <Text style={{...styles.title, color:props.color}}>{props.title}</Text>
            <View style={styles.dataWrapper}>
                <Text style={{...styles.data, color:props.color}}>{props.data}</Text>
                <Text style={{...styles.unit, color:props.color}}>{props.unit}</Text>
            </View>
            {/* <View style={styles.contentWrapper}>
                <View>
                    <Text style={styles.content}>Đánh giá</Text>
                    <Text style={{color:'#61D215',fontSize:20, fontWeight:'700'}}>Tốt</Text>
                    <Text style={styles.content}>Trung bình</Text>
                    <Text style={{color:'#C8D215',fontSize:20, fontWeight:'700'}}>28{props.unit}</Text>
                </View>
                <View>
                    <Text style={styles.content}>Trực tiếp</Text>
                    <Text style={styles.content}>{date.getHours()}:{date.getMinutes()}</Text>
                </View>
            </View> */}
        </View>
    )
}

const styles = StyleSheet.create({
    card:{
        display:'flex',
        alignItems:'center',
        justifyContent:'center',
        borderRadius:40,
        backgroundColor:'#f5f5f5',
        elevation:3,
        shadowOffset:{width: 2, height: 2},
        shadowColor:'#3C3C3C',
        shadowOpacity: 0.3,
        paddingHorizontal:30,
        paddingVertical:30,
        gap:5
    },
    dataWrapper:{
        display:'flex',
        flexDirection:'row',
        alignItems:'center',
        gap:2
    },
    data:{
        fontSize:96,
        fontWeight:'bold'
    },
    unit:{
        color:'#61D215',
        fontSize:50,
        fontWeight:'bold' 
    },
    contentWrapper:{
        display:'flex',
        flexDirection:'row',
        gap:65,
        justifyContent:'space-between'
    },
    content:{
        fontWeight:'600',
        fontSize:20
    },
    title:{
        fontSize:50,
        fontWeight:'semibold'
    }

})