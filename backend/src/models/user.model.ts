import { Database } from 'sql.js';
import bcrypt from 'bcrypt';

export interface User {
  id: number;
  email: string;
  password_hash: string;
  display_name: string;
  networking_intention: 'Searching for a job' | 'Searching for a hire' | 'Just chat';
  industry: string;
  tech_skills: string[]; // JSON array
  soft_skills: string[]; // JSON array
  created_at: string;
  updated_at: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  display_name: string;
  networking_intention: 'Searching for a job' | 'Searching for a hire' | 'Just chat';
  industry: string;
  tech_skills: string[];
  soft_skills: string[];
}

export interface UpdateUserDto {
  display_name: string;
  networking_intention: 'Searching for a job' | 'Searching for a hire' | 'Just chat';
  industry: string;
  tech_skills: string[];
  soft_skills: string[];
}

export interface UserResponse {
  id: number;
  email: string;
  display_name: string;
  networking_intention: string;
  industry: string;
  tech_skills: string[];
  soft_skills: string[];
  created_at: string;
}

export class UserModel {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async create(userData: CreateUserDto): Promise<User> {
    // Hash password
    const password_hash = await bcrypt.hash(userData.password, 12);

    // Insert user
    this.db.run(
      `INSERT INTO users (email, password_hash, display_name, networking_intention, industry, tech_skills, soft_skills)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userData.email,
        password_hash,
        userData.display_name,
        userData.networking_intention,
        userData.industry,
        JSON.stringify(userData.tech_skills),
        JSON.stringify(userData.soft_skills)
      ]
    );

    // Get the created user
    const result = this.db.exec(
      'SELECT * FROM users WHERE email = ?',
      [userData.email]
    );

    if (result.length === 0 || !result[0].values || result[0].values.length === 0) {
      throw new Error('Failed to create user');
    }

    return this.mapRowToUser(result[0], result[0].values[0]);
  }

  findByEmail(email: string): User | null {
    const result = this.db.exec(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (result.length === 0 || !result[0].values || result[0].values.length === 0) {
      return null;
    }

    return this.mapRowToUser(result[0], result[0].values[0]);
  }

  findById(id: number): User | null {
    const result = this.db.exec(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (result.length === 0 || !result[0].values || result[0].values.length === 0) {
      return null;
    }

    return this.mapRowToUser(result[0], result[0].values[0]);
  }

  findAll(): User[] {
    const result = this.db.exec('SELECT * FROM users ORDER BY created_at DESC');

    if (result.length === 0 || !result[0].values || result[0].values.length === 0) {
      return [];
    }

    return result[0].values.map(row => this.mapRowToUser(result[0], row));
  }

  update(id: number, userData: UpdateUserDto): boolean {
    try {
      this.db.run(
        `UPDATE users
         SET display_name = ?,
             networking_intention = ?,
             industry = ?,
             tech_skills = ?,
             soft_skills = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          userData.display_name,
          userData.networking_intention,
          userData.industry,
          JSON.stringify(userData.tech_skills),
          JSON.stringify(userData.soft_skills),
          id
        ]
      );
      return true;
    } catch (error) {
      console.error('Update user error:', error);
      return false;
    }
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async setResetToken(email: string, hashedToken: string, expiry: Date): Promise<boolean> {
    try {
      this.db.run(
        `UPDATE users
         SET reset_token = ?,
             reset_token_expiry = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE email = ?`,
        [hashedToken, expiry.toISOString(), email]
      );
      return true;
    } catch (error) {
      console.error('Set reset token error:', error);
      return false;
    }
  }

  findByResetToken(hashedToken: string): User | null {
    const result = this.db.exec(
      `SELECT * FROM users
       WHERE reset_token = ?
       AND reset_token_expiry > datetime('now')`,
      [hashedToken]
    );

    if (result.length === 0 || !result[0].values || result[0].values.length === 0) {
      return null;
    }

    return this.mapRowToUser(result[0], result[0].values[0]);
  }

  async resetPassword(userId: number, newPassword: string): Promise<boolean> {
    try {
      const password_hash = await bcrypt.hash(newPassword, 12);
      this.db.run(
        `UPDATE users
         SET password_hash = ?,
             reset_token = NULL,
             reset_token_expiry = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [password_hash, userId]
      );
      return true;
    } catch (error) {
      console.error('Reset password error:', error);
      return false;
    }
  }

  clearResetToken(userId: number): boolean {
    try {
      this.db.run(
        `UPDATE users
         SET reset_token = NULL,
             reset_token_expiry = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [userId]
      );
      return true;
    } catch (error) {
      console.error('Clear reset token error:', error);
      return false;
    }
  }

  toResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
      networking_intention: user.networking_intention,
      industry: user.industry,
      tech_skills: user.tech_skills,
      soft_skills: user.soft_skills,
      created_at: user.created_at
    };
  }

  private mapRowToUser(result: any, row: any[]): User {
    const columns = result.columns;
    const user: any = {};

    columns.forEach((col: string, index: number) => {
      user[col] = row[index];
    });

    // Parse JSON fields
    if (typeof user.tech_skills === 'string') {
      user.tech_skills = JSON.parse(user.tech_skills);
    }
    if (typeof user.soft_skills === 'string') {
      user.soft_skills = JSON.parse(user.soft_skills);
    }

    return user as User;
  }
}
