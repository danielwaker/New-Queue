import { IonButton, IonContent, IonHeader, IonIcon, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { refreshCircleOutline } from 'ionicons/icons';
import ExploreContainer from '../components/ExploreContainer';
import './Tab1.css';

const Tab1: React.FC = () => {
  return (
    <IonPage>
      <IonHeader collapse="condense">
        <IonToolbar>
          {/* <IonTitle size="large">Tab 1</IonTitle> */}
          <IonButton fill="clear" slot="end">
            <IonIcon icon={refreshCircleOutline}></IonIcon>
          </IonButton>
        </IonToolbar>
      </IonHeader>      
      <IonContent fullscreen>
        <IonButton>Create Session</IonButton>
        <ExploreContainer name="Tab 1 page" />
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
