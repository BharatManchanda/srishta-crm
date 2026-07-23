import { Injectable, OnModuleInit } from "@nestjs/common";

@Injectable()
export class OnlineUserService implements OnModuleInit {
    private readonly users = new Map<number, Set<string>>();

    onModuleInit() {
        console.log("OnlineUserService initialized");
    }

    add(userId: number, socketId: string): void {
        if (!this.users.has(userId)) {
            this.users.set(userId, new Set());
        }
        this.users.get(userId)!.add(socketId);
    }

    remove(userId: number, socketId: string): void {
        if (!this.users.has(userId)) return;

        this.users.get(userId)!.delete(socketId);

        if (this.users.get(userId)!.size === 0) {
            this.users.delete(userId);
        }
    }

    has(userId: number): boolean {
        return this.users.has(userId) && this.users.get(userId)!.size > 0;
    }

    getSocketIds(userId: number): string[] {
        return Array.from(this.users.get(userId) || []);
    }
}