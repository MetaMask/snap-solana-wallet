import { Accounts } from '../components/Accounts/Accounts';
import { ProtocolDetails } from '../components/ProtocolDetails/ProtocolDetails';
import { PageTemplate } from '../templates/page';

const Index = () => {
  return (
    <PageTemplate>
      <ProtocolDetails />
      <Accounts />
    </PageTemplate>
  );
};

export default Index;
