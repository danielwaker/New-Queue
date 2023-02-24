import { IonButton, IonContent, IonHeader, IonIcon, IonInput, IonItem, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { closeCircleOutline, searchOutline } from 'ionicons/icons';
import { useRef, useState } from 'react';
import ExploreContainer from '../components/ExploreContainer';
import './Tab2.css';

const Tab2: React.FC = () => {
  const [inputModel, setInputModel ] = useState('');
  const ionInputEl = useRef<HTMLIonInputElement>(null);
  
  const onInput = (ev: Event) => {
    const value = (ev.target as HTMLIonInputElement).value as string;
    
    // Removes non alphanumeric characters
    const filteredValue = value.replace(/[^a-zA-Z0-9]+/g,'');
    
    /**
     * Update both the state variable and
     * the component to keep them in sync.
     */
    setInputModel(filteredValue);
    
    const inputCmp = ionInputEl.current;
    if (inputCmp !== null) {
      inputCmp.value = filteredValue;
    }
  }

  function clear() {
    
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Search Songs</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonItem class="search">
            <IonInput value={inputModel} onIonInput={onInput} ref={ionInputEl}>
              <IonButton>
                <IonIcon class="search-icon" icon={searchOutline}></IonIcon>
              </IonButton>
            </IonInput>
            <IonButton fill="clear" onClick={clear}>
              <IonIcon class="x-icon" icon={closeCircleOutline}></IonIcon>
            </IonButton>
          </IonItem>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <ExploreContainer name="Tab 2 page" />
      </IonContent>
    </IonPage>
  );
};

export default Tab2;
