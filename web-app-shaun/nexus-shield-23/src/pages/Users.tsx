import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export const Users = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">View and manage users, assign roles, and update permissions.</p>
          <div className="mt-4">(User management features coming soon)</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Users;
