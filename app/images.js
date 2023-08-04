import {useContext} from "react";
import {AppContext} from "./_layout";
import {useLocalSearchParams, useRouter} from "expo-router";
import {ItemList} from "../components/ItemList";

export default function Images() {
  const appContext = useContext(AppContext);
  const router = useRouter();
  const params = useLocalSearchParams();
  const { projectName } = params;

  const loadImageList = (response) => {
    return response.json().then((responseJSON) => {
      const images = [];
      if (responseJSON.hasOwnProperty('error')) {
        // TODO: Handle invalid token
        console.error('Invalid token');
      } else if (responseJSON.hasOwnProperty('Images')) {
        responseJSON.Images.map((image, index) => {
          images.push({
            id: index,
            title: image.Link.split('/').slice(-1)[0],
            isResource: true,
            loadResource: () => loadImage(image.Link),
            ...image
          });
        });
      }
      if (images.length === 0) {
        images.push({
          id: 1,
          title: 'No images found. Swipe down to refresh',
          isResource: false,
        });
      }
     return images;
    }).catch((error) => {
      console.error(error);
      return [];
    });
  }

  const loadImage = (url) => {
    router.push({
      pathname: 'viewer',
      params: {
        url: url,
        isLorisRequest: true
      }
    });
  }

  return <ItemList
    resourceEndpoint={`projects/${projectName}/images`}
    handleLoadResourceList={loadImageList}
  />;
};
