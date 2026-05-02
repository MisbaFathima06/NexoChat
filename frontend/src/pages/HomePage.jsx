import { useAppSelector } from "../store/hooks";
import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser } = useAppSelector((state) => state.chat);
  const { selectedGroup } = useAppSelector((state) => state.groups);

  return (
    <div className="h-screen bg-base-200 pt-16">
      <div className="w-full h-[calc(100vh-4rem)] flex overflow-hidden">
            <Sidebar />
        {!selectedUser && !selectedGroup ? <NoChatSelected /> : <ChatContainer />}
      </div>
    </div>
  );
};
export default HomePage;