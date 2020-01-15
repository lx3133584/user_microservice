import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as Joi from 'joi';

export interface EnvConfig {
  [key: string]: any;
}

@Injectable()
export class ConfigService {
  private readonly envConfig: EnvConfig;

  constructor(filePath: string) {
    let file: Buffer | undefined;
    try {
      file = fs.readFileSync(filePath);
    } catch (error) {
      file = fs.readFileSync('development.env');
    }

    const config = dotenv.parse(file);
    this.envConfig = this.validateInput(config);
  }

  private validateInput(envConfig: EnvConfig): EnvConfig {
    const envVarsSchema: Joi.ObjectSchema = Joi.object({
      IMAGES_URL: Joi.string().default('http://localhost:3000/images/'),
      JWT_SECRET: Joi.string().required(),
      JWT_EXPIRES_IN: Joi.number(),
      EMAIL_ENABLED: Joi.boolean().default(false),
      EMAIL_SERVICE: Joi.string().when('EMAIL_ENABLED', {
        is: true,
        then: Joi.required(),
      }),
      EMAIL_USERNAME: Joi.string().when('EMAIL_ENABLED', {
        is: true,
        then: Joi.required(),
      }),
      EMAIL_PASSWORD: Joi.string().when('EMAIL_ENABLED', {
        is: true,
        then: Joi.required(),
      }),
      EMAIL_FROM: Joi.string().when('EMAIL_ENABLED', {
        is: true,
        then: Joi.required(),
      }),
      TEST_EMAIL_TO: Joi.string(),
      MYSQL_HOST: Joi.string().required(),
      MYSQL_PORT: Joi.number().default(3306),
      MYSQL_USERNAME: Joi.string().required(),
      MYSQL_PASSWORD: Joi.string().required(),
      MYSQL_DATABASE: Joi.string().default('user'),
    });

    const { error, value: validatedEnvConfig } = Joi.validate(envConfig, envVarsSchema);
    if (error) {
      throw new Error(`Config validation error in your env file: ${error.message}`);
    }
    return validatedEnvConfig;
  }

  get jwtExpiresIn(): number | undefined {
    if (this.envConfig.JWT_EXPIRES_IN) {
      return +this.envConfig.JWT_EXPIRES_IN;
    }
    return undefined;
  }

  get jwtSecret(): string {
    return this.envConfig.JWT_SECRET;
  }

  get imagesUrl(): string {
    return this.envConfig.IMAGES_URL;
  }

  get emailService(): string | undefined {
    return this.envConfig.EMAIL_SERVICE;
  }

  get emailUsername(): string | undefined {
    return this.envConfig.EMAIL_USERNAME;
  }

  get emailPassword(): string | undefined {
    return this.envConfig.EMAIL_PASSWORD;
  }

  get emailFrom(): string | undefined {
    return this.envConfig.EMAIL_FROM;
  }

  get testEmailTo(): string | undefined {
    return this.envConfig.TEST_EMAIL_TO;
  }

  get mongoUser(): string | undefined {
    return this.envConfig.MONGO_USER;
  }

  get mongoPassword(): string | undefined {
    return this.envConfig.MONGO_PASSWORD;
  }

  get emailEnabled(): boolean {
    return Boolean(this.envConfig.EMAIL_ENABLED).valueOf();
  }

  get mongoAuthEnabled(): boolean {
    return Boolean(this.envConfig.MONGO_AUTH_ENABLED).valueOf();
  }

  get mysqlConfig() {
    return {
      host: this.envConfig.MYSQL_HOST,
      port: this.envConfig.MYSQL_PORT,
      username: this.envConfig.MYSQL_USERNAME,
      password: this.envConfig.MYSQL_PASSWORD,
      database: this.envConfig.MYSQL_DATABASE,
    };
  }
}
