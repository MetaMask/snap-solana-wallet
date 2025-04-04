import { Accounts } from '../components/Accounts/Accounts';
import { Handlers } from '../components/Handlers/Handlers';
import { PageTemplate } from '../templates/page';

const Index = () => {
  return (
    <PageTemplate>
      <Accounts />
      <Handlers />
    </PageTemplate>
  );
};

export default Index;
