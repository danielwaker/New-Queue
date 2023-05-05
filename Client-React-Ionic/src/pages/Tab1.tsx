import { IonButton, IonContent, IonHeader, IonIcon, IonPage, IonToolbar } from '@ionic/react';
import { refreshCircleOutline } from 'ionicons/icons';
import ExploreContainer from '../components/ExploreContainer';
import './Tab1.scss';

const Tab1: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          {/* <IonTitle size="large">Tab 1</IonTitle> */}
          <IonButton fill="clear" slot="end" class="refresh">
            <IonIcon icon={refreshCircleOutline} size="large"></IonIcon>
          </IonButton>
        </IonToolbar>
      </IonHeader>      
      <IonContent fullscreen>
        <IonButton class="create-session">Create Session</IonButton>
        <ExploreContainer name="Tab 1 page" />
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
