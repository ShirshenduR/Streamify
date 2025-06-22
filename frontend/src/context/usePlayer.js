import PlayerContext from './PlayerContext';
import { useContext } from 'react';

export function usePlayer() {
  return useContext(PlayerContext);
}
