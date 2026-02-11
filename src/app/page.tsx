import Feed from "@/components/Feed";
import { type FeedCardProps } from "@/components/FeedCard";

const MOCK_FEED: FeedCardProps[] = [
  {
    username: "Green",
    handle: "akan81.pds.coord.dev",
    avatarBg: "green",
    timestamp: "1 month ago",
    status: "pending",
    id: "8185a18e32ab",
    createdDate: "2025-12-29",
    title:
      "AP2 Integrates Membrane Tension And Cargo Signals To Trigger Actin Switch At Clathrin Pits",
    hypothesisText:
      "AP2 functions as a mechano-cargo coincidence detector that switches the identity and valency of the actin nucleation machinery at clathrin-coated pits when two conditions are …",
    commentCount: 8,
    likeCount: 8,
  },
  {
    username: "Green",
    handle: "akan81.pds.coord.dev",
    avatarBg: "green",
    timestamp: "1 month ago",
    status: "pending",
    id: "8185a18e32ab",
    createdDate: "2025-12-29",
    title:
      "AP2 Integrates Membrane Tension And Cargo Signals To Trigger Actin Switch At Clathrin Pits",
    hypothesisText:
      "AP2 functions as a mechano-cargo coincidence detector that switches the identity and valency of the actin nucleation machinery at clathrin-coated pits when two conditions are …",
    commentCount: 8,
    likeCount: 8,
  },
  {
    username: "akan81.pds.coord.dev",
    handle: "akan81.pds.coord.dev",
    avatarBg: "yellow",
    timestamp: "1 month ago",
    status: "pending",
    id: "8185a18e32ab",
    createdDate: "2025-12-29",
    title:
      "AP2 Integrates Membrane Tension And Cargo Signals To Trigger Actin Switch At Clathrin Pits",
    hypothesisText:
      "AP2 functions as a mechano-cargo coincidence detector that switches the identity and valency of the actin nucleation machinery at clathrin-coated pits when two conditions are …",
    commentCount: 8,
    likeCount: 8,
  },
  {
    username: "akan81.pds.coord.dev",
    handle: "akan81.pds.coord.dev",
    avatarBg: "yellow",
    timestamp: "1 month ago",
    status: "pending",
    id: "8185a18e32ab",
    createdDate: "2025-12-29",
    title:
      "AP2 Integrates Membrane Tension And Cargo Signals To Trigger Actin Switch At Clathrin Pits",
    hypothesisText:
      "AP2 functions as a mechano-cargo coincidence detector that switches the identity and valency of the actin nucleation machinery at clathrin-coated pits when two conditions are …",
    commentCount: 8,
    likeCount: 8,
  },
];

export default function Home() {
  return (
    <main className="flex justify-center pt-60">
      <Feed items={MOCK_FEED} />
    </main>
  );
}
