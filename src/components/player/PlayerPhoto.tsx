import { playerPhotoUrl } from "../../data/photos";

type Props = {
  id: string;
  name: string;
  className?: string;
};

export function PlayerPhoto({ id, name, className }: Props) {
  return (
    <img
      src={playerPhotoUrl(id, name)}
      alt={name}
      className={className ?? "h-14 w-14 rounded-xl object-cover bg-gray-700"}
      loading="lazy"
    />
  );
}
