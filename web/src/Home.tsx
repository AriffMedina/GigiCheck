import { Button, Icon } from "./ui";

export const Home = ({ onStart }: { onStart: () => void }) => (
  <div className="home">
    <Button className="big" onClick={onStart}>
      <Icon name="spark" size={28} />
      Iniciar conteo
    </Button>
  </div>
);
