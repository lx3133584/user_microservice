import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { createTransport, SendMailOptions } from 'nodemailer';
import { ConfigService } from '../config/config.service';
import * as bcrypt from 'bcrypt';
import { User } from './users.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateUserInput, CreateUserInput } from './users.interface';

const saltRounds = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userModel: Repository<User>,
    private configService: ConfigService,
  ) {}

  /**
   * Returns if the user has 'admin' set on the permissions array
   *
   * @param {string[]} permissions permissions property on a User
   * @returns {boolean}
   * @memberof UsersService
   */
  isAdmin(permissions: string): boolean {
    return permissions.includes('admin');
  }

  /**
   * Adds any permission string to the user's permissions array property. Checks if that value exists
   * before adding it.
   *
   * @param {string} permission The permission to add to the user
   * @param {number} id The user's id
   * @returns {(Promise<User | undefined>)} The user Document with the updated permission. Undefined if the
   * user does not exist
   * @memberof UsersService
   */
  async addPermission(
    permission: string,
    id: number,
  ) {
    const user = await this.findOne(id);
    if (!user) return undefined;
    if (user.permissions.includes(permission)) return user;
    user.permissions = user.permissions.split(',').concat(permission).join();
    await this.userModel.save(user);
    return user;
  }

  /**
   * Removes any permission string from the user's permissions array property.
   *
   * @param {string} permission The permission to remove from the user
   * @param {number} id The id of the user to remove the permission from
   * @returns {(Promise<User | undefined>)} Returns undefined if the user does not exist
   * @memberof UsersService
   */
  async removePermission(
    permission: string,
    id: number,
  ): Promise<User | undefined> {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error(`${id} not found`);
    }
    user.permissions = user.permissions.split(',').filter(
      userPermission => userPermission !== permission,
    ).join();
    await this.userModel.save(user);
    return user;
  }

  /**
   * Updates a user in the database. If any value is invalid, it will still update the other
   * fields of the user.
   *
   * @param {number} id of the user to update
   * @param {UpdateUserInput} fieldsToUpdate The user can update their id, email, password, or enabled. If
   * the id is updated, the user's token will no longer work. If the user disables their account, only an admin
   * can reenable it
   * @returns {(Promise<User | undefined>)} Returns undefined if the user cannot be found
   * @memberof UsersService
   */
  async update(
    id: number,
    fieldsToUpdate: UpdateUserInput,
  ): Promise<User | undefined> {
    const user = await this.findOne(
      id,
    );

    if (!user) {
      throw new Error(`${id} not found`);
    }

    // Remove undefined keys for update
    for (const key in fieldsToUpdate) {
      if (typeof fieldsToUpdate[key] !== 'undefined' && key !== 'password') {
        user[key] = fieldsToUpdate[key];
      }
    }

    await this.userModel.save(user);

    if (!user) return undefined;

    return user;
  }

  /**
   * Send an email with a password reset code and sets the reset token and expiration on the user.
   * EMAIL_ENABLED must be true for this to run.
   *
   * @param {string} email address associated with an account to reset
   * @returns {Promise<boolean>} if an email was sent or not
   * @memberof UsersService
   */
  async forgotPassword(email: string): Promise<boolean> {
    if (!this.configService.emailEnabled) return false;

    const user = await this.findOneByEmail(email);
    if (!user) return false;

    const token = randomBytes(32).toString('hex');

    // One day for expiration of reset token
    const expiration = new Date(Date().valueOf() + 24 * 60 * 60 * 1000);

    const transporter = createTransport({
      service: this.configService.emailService,
      auth: {
        user: this.configService.emailUsername,
        pass: this.configService.emailPassword,
      },
    });

    const mailOptions: SendMailOptions = {
      from: this.configService.emailFrom,
      to: email,
      subject: `Reset Password`,
      text: `${user.id},
      Replace this with a website that can pass the token:
      ${token}`,
    };

    return new Promise(resolve => {
      transporter.sendMail(mailOptions, (err, info) => {
        if (err) {
          resolve(false);
          return;
        }

        // user.passwordReset = {
        //   token,
        //   expiration,
        // };

        this.userModel.save(user).then(() => resolve(true), () => resolve(false));
      });
    });
  }

  /**
   * Resets a password after the user forgot their password and requested a reset
   *
   * @param {number} id
   * @param {string} code the token set when the password reset email was sent out
   * @param {string} password the new password the user wants
   * @returns {(Promise<User | undefined>)} Returns undefined if the code or the id is wrong
   * @memberof UsersService
   */
  async resetPassword(
    id: number,
    code: string,
    password: string,
  ): Promise<User | undefined> {
    // const user = await this.findOne(id);
    // if (user && user.passwordReset && user.enabled !== false) {
    //   if (user.passwordReset.token === code) {
    //     user.password = password;
    //     user.passwordReset = undefined;
    //     await user.save();
    //     return user;
    //   }
    // }
    return undefined;
  }

  /**
   * Creates a user
   *
   * @param {CreateUserInput} createUserInput id, email, and password. id and email must be
   * unique, will throw an email with a description if either are duplicates
   * @returns {Promise<User>} or throws an error
   * @memberof UsersService
   */
  async create(createUserInput: CreateUserInput): Promise<User> {

    // createUserInput.password = await bcrypt.hash(createUserInput.password, saltRounds);

    const user = this.userModel.create(createUserInput);
    this.userModel.merge(user, {
      createdTime: new Date(),
      lastLoginTime: new Date(),
      updatedTime: new Date(),
    });
    await this.userModel.save(user);
    return user;
  }

  /**
   * Returns a user by their unique usernameor undefined
   *
   * @param {string} username of user, not case sensitive
   * @returns {(Promise<User | undefined>)}
   * @memberof UsersService
   */
  async findOneByUsername(username: string): Promise<User | undefined> {
    const user = await this.userModel
      .findOne({ username });
    if (user) return user;
    return undefined;
  }

  /**
   * Returns a user by their unique email address or undefined
   *
   * @param {string} email address of user, not case sensitive
   * @returns {(Promise<User | undefined>)}
   * @memberof UsersService
   */
  async findOneByEmail(email: string): Promise<User | undefined> {
    const user = await this.userModel
      .findOne({ email });
    if (user) return user;
    return undefined;
  }

  /**
   * Returns a user by their unique id or undefined
   *
   * @param {number} id of user, not case sensitive
   * @returns {(Promise<User | undefined>)}
   * @memberof UsersService
   */
  findOne(id: number) {
    return this.userModel
      .findOne(id);
  }

  /**
   * Gets all the users that are registered
   *
   * @returns {Promise<User[]>}
   * @memberof UsersService
   */
  async getAllUsers(): Promise<User[]> {
    const users = await this.userModel.find();
    return users;
  }

  /**
   * Deletes all the users in the database, used for testing
   *
   * @returns {Promise<void>}
   * @memberof UsersService
   */
  async deleteAllUsers(): Promise<void> {
    await this.userModel.clear();
  }

  /**
   * Deletes all the users in the database, used for testing
   *
   * @returns {Promise<void>}
   * @memberof UsersService
   */
  async checkPassword(
    user: User,
    password: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (error, isMatch) => {
        if (error) {
          reject(error);
        }

        resolve(isMatch);
      });
    });
  }
}
