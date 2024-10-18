import Gun from 'gun';

export class AccessControl {
    private gun: Gun;

    constructor(gun: Gun) {
        this.gun = gun;
    }

    async grantAccess(userPubKey: string, dataKey: string): Promise<void> {
        await this.gun.get(`access_control/${dataKey}`).set(userPubKey);
    }

    async revokeAccess(userPubKey: string, dataKey: string): Promise<void> {
        await this.gun.get(`access_control/${dataKey}`).unset(userPubKey);
    }

    async hasAccess(userPubKey: string, dataKey: string): Promise<boolean> {
        return new Promise((resolve) => {
            this.gun.get(`access_control/${dataKey}`).once((data) => {
                if (data) {
                    resolve(Object.keys(data).includes(userPubKey));
                } else {
                    resolve(false);
                }
            });
        });
    }
}
