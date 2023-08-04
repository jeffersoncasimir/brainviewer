import React, {useContext, useEffect, useState} from "react";
import {View, Text, SafeAreaView, FlatList, RefreshControl, TouchableOpacity, StyleSheet} from 'react-native';
import {AppContext} from "../app/_layout";
import {StatusBar} from "expo-status-bar";

export function ItemList(props) {
  const appContext = useContext(AppContext);
  const {resourceEndpoint, handleLoadResourceList} = props;
  const [refreshing, setRefreshing] = useState(false);
  const [resourceList, setResourceList] = useState([]);

  useEffect(() => {
    loadResourceList();
  }, []);

  const loadResourceList = () => {
    setResourceList([]);
    setRefreshing(true);
    fetch(`${appContext.apiURL}/${resourceEndpoint}`,
      {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer: ${appContext.token}`,
        },
    })
      .then((response) => handleLoadResourceList(response))
      .then((resources) => {
        setRefreshing(false);
        setResourceList(resources);
    });
  }

  const ListItem = ({title, isResource, loadResource}) => {
    return (
      <TouchableOpacity
        disabled={!isResource}
        onPress={loadResource}>
        <View style={styles.item}>
          <Text style={styles.title}>{title}</Text>
          {isResource && <Text style={styles.chevron}>></Text>}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={refreshing ? [{id: 0, title: 'Refreshing'}] : resourceList}
        renderItem={({item}) =>
          <ListItem
            title={item.title}
            isResource={item.isResource}
            loadResource={item.loadResource}
          />
        }
        keyExtractor={item => item.id}
        refreshControl=<RefreshControl refreshing={refreshing} onRefresh={loadResourceList}/>
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight || 0,
  },
  item: {
    padding: 15,
    marginVertical: 5,
    marginHorizontal: 10,
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: "#2f7df3",
    fontSize: 16,
  },
  chevron: {
    color: "#2f7df3",
    fontSize: 24,
  },
});
