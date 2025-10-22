import React from 'react';
import GameEmbed from './GameEmbed';

const DinoRunner: React.FC = () => {
  return (
    <div style={{ paddingTop: 84 }}>
      <GameEmbed slug="dino-runner" fullScreen={true} />
    </div>
  );
}

export default DinoRunner;
