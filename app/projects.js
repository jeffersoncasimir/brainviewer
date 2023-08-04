import {useRouter} from "expo-router";
import {ItemList} from "../components/ItemList";

export default function Projects() {
  const router = useRouter();

  const loadProjectList = (response) => {
    return response.json().then((responseJSON) => {
      const projects = [];
      if (responseJSON.hasOwnProperty('error')) {
        // TODO: Handle invalid token
        console.error('Invalid token');
      } else if (responseJSON.hasOwnProperty('Projects')) {
        Object.keys(responseJSON.Projects).map((projectName, index) => {
          projects.push({
            id: index,
            title: projectName,
            isResource: true,
            loadResource: () => loadProject(projectName),
          });
        });
      }
      if (projects.length === 0) {
        projects.push({
          id: 1,
          title: 'No projects found. Swipe down to refresh',
          isResource: false,
        });
      }
      return projects;
    }).catch((error) => {
      console.error(error);
      return [];
    });
  }

  const loadProject = (title) => {
    router.push({
      pathname: 'images',
      params: {
        projectName: title
      }
    });
  }

  return <ItemList
    resourceEndpoint='projects'
    handleLoadResourceList={loadProjectList}
  />;
};
