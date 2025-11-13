import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find ABC Bakery admin user
  const john = await prisma.user.findFirst({
    where: {
      email: { contains: 'abc' },
    },
    include: {
      client: true,
    },
  });

  if (!john) {
    console.log('❌ User not found');
    return;
  }

  // Get user's role with permissions
  const role = john.roleId
    ? await prisma.role.findUnique({
        where: { id: john.roleId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      })
    : null;

  if (!role) {
    console.log('❌ Role not found');
    return;
  }

  console.log('👤 User: ' + john.firstName + ' ' + john.lastName);
  console.log('📧 Email: ' + john.email);
  console.log('📦 Client: ' + john.client.name);
  console.log('👥 Role: ' + role.name);
  console.log('\n🔍 Checking for Super Admin-only permissions:\n');

  const clientPerms = role.permissions.filter(
    (rp) => rp.permission.resource === 'clients'
  );
  const rolePerms = role.permissions.filter((rp) => rp.permission.resource === 'roles');
  const permPerms = role.permissions.filter(
    (rp) => rp.permission.resource === 'permissions'
  );

  console.log('📦 Client Management: ' + clientPerms.length);
  if (clientPerms.length > 0) {
    console.log('   ❌ UNAUTHORIZED!');
    clientPerms.forEach((rp) => {
      console.log('      - ' + rp.permission.resource + ':' + rp.permission.action);
    });
  } else {
    console.log('   ✅ OK');
  }

  console.log('\n👥 Role Management: ' + rolePerms.length);
  if (rolePerms.length > 0) {
    console.log('   ❌ UNAUTHORIZED!');
    rolePerms.forEach((rp) => {
      console.log('      - ' + rp.permission.resource + ':' + rp.permission.action);
    });
  } else {
    console.log('   ✅ OK');
  }

  console.log('\n🔐 Permissions Management: ' + permPerms.length);
  if (permPerms.length > 0) {
    console.log('   ❌ UNAUTHORIZED!');
    permPerms.forEach((rp) => {
      console.log('      - ' + rp.permission.resource + ':' + rp.permission.action);
    });
  } else {
    console.log('   ✅ OK');
  }

  console.log('\n📊 Total permissions: ' + role.permissions.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
