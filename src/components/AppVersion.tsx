import { observer } from 'mobx-react-lite';
import { appRootStore } from '../stores/root.store';
import { APP } from '../consts/app';

/**
 * Le numero de version affiche.
 *
 * Il vient du nom de version regle dans le dashboard, pour que le site, l'app
 * mobile et l'annonce faite aux utilisateurs disent le meme numero sans avoir a
 * republier le site a chaque fois. Tant que l'API n'a pas repondu, ou si le
 * champ n'a jamais ete rempli, on retombe sur la version du build : un pied de
 * page sans numero serait pire qu'un numero un peu ancien.
 */
export const AppVersion = observer(() => {
  const name = appRootStore.systemStore.appVersionName;
  return <>{name ? `v${name}` : APP.INFO.APP_VERSION}</>;
});
