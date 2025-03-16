import { View, Text,StyleSheet, Image, TouchableOpacity } from "react-native";
import { useNavigation } from "expo-router";


export default function Header() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.text}>
        Vườn của Bảnh
      </Text>

      {/* User Avatar */}
      <TouchableOpacity>
        <View style={styles.card}>
        <Image 
          source={{ uri: "https://i.pravatar.cc/50" }} 
          style={styles.img}
        />
        </View>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
container:{
    display:'flex',
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'flex-end',
    width:'100%',
    paddingTop:30,
    paddingBottom:30,
    paddingHorizontal:20
},
  card: {
    width: 40,
    height: 40,
    borderRadius: 50,
    marginLeft: 20,
    backgroundColor: "#000",
    shadowColor: "#64A30E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 10, // For Android shadow
    alignItems: "center",
    justifyContent: "center",
  },
  img:{
    width: 40,
    height: 40,
    borderRadius: 50,
  },
  text:{ fontSize: 18, fontWeight: "semibold", color: "#3C3C3" }
});



