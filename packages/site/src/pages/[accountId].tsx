import { AccountDetails } from '../components/AccountDetails/AccountDetails';
import { PageTemplate } from '../templates/page';

const AccountPage = ({ params }: { params: { accountId: string } }) => {
  return (
    <PageTemplate>
      <AccountDetails accountId={params.accountId} />
    </PageTemplate>
  );
};

export default AccountPage;
