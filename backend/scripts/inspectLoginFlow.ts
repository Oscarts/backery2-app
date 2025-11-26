import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@abcbakery.com';
    const password = 'password123';
    console.log('Inspecting login flow for', email);

    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: {
            client: true,
            customRole: {
                include: {
                    permissions: {
                        include: { permission: true }
                    }
                }
            }
        }
    });

    if (!user) {
        console.log('User not found');
        process.exit(0);
    }

    console.log('User found:', { id: user.id, email: user.email, isActive: user.isActive });
    console.log('Client:', { id: user.client?.id, name: user.client?.name, isActive: user.client?.isActive });

    if (!user.isActive) console.log('User is not active');
    if (!user.client?.isActive) console.log('Client is not active');

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log('bcrypt.compare =>', isPasswordValid);

    // Show customRole summary
    if (user.customRole) {
        console.log('Custom role:', { id: user.customRole.id, name: user.customRole.name });
        console.log('Permissions count:', user.customRole.permissions.length);
    } else {
        console.log('No custom role attached');
    }

    await prisma.$disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
