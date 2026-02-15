import { configDotenv } from "dotenv";
import express from 'express'
import morgan from "morgan";
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import hpp from 'hpp'
import cookieParser from "cookie-parser";
import cors from 'cors'
import perfectExpressSanitizer from "perfect-express-sanitizer";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.route.js"

import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export const app=express()

let openApiSpec;
try {
    openApiSpec = YAML.load(join(__dirname, '../docs/openapi.yaml'));
    logger.info('OpenAPI specification loaded successfully');
} catch (error) {
    logger.warn(' Could not load OpenAPI spec:', error.message);
}

if(process.env.NODE_ENV=="DEVELOPMENT"){
app.use(morgan('dev'))

}

//global rate limiting
const limiter=rateLimit({
    windowMs:15*60*1000,
    limit:100,
    message:"Error!! To many requests detected ! please try later"
})

//security
app.use(hpp())
app.use(limiter)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "https://cdn.jsdelivr.net", "https://petstore.swagger.io"],
            "script-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            "font-src": ["'self'", "https://cdn.jsdelivr.net"]
        }
    }
}))
app.set('trust proxy', 1)
app.use(cookieParser())
app.use(cors({
    origin:process.env.CLIENT_URL,
    credentials:true,
    methods:["GET","POST","PUT","DELETE","PATCH","HEAD","OPTIONS"],
    allowedHeaders:[
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "device-remember-token",
        "Access-Control-Allow-Origin",
        "Origin",
        "Accept",
    ]
}))

app.use(express.json({limit:'10kb'}))
app.use(express.urlencoded({extended:true,limit:'10kb'}))
app.use(
  perfectExpressSanitizer.clean({
    xss: true,
    noSql: true,
    sql: true,
  })
);



app.get('/health', (req, res) => {
    res.status(200).send(" Auth-System is healthy");
});

if (openApiSpec) {
    // Swagger UI at /api-docs
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
        customCss: `
            .swagger-ui .topbar { display: none }
            .swagger-ui .info .title { color: #dd5522; font-size: 2.5rem; }
            .swagger-ui .info .description { font-size: 1rem; }
        `,
        customSiteTitle: "Auth-system API Documentation",
        customfavIcon: "/favicon.ico",
        swaggerOptions: {
            persistAuthorization: true,  // Persist auth across page reloads
            displayRequestDuration: true,
            filter: true,
            syntaxHighlight: {
                activate: true,
                theme: "monokai"
            },
            defaultModelsExpandDepth: 3,
            defaultModelExpandDepth: 3,
            docExpansion: 'list',
            displayOperationId: false
        }
    }));

    // Raw OpenAPI JSON endpoint
    app.get('/api-docs/json', (req, res) => {
        res.json(openApiSpec);
    });

    // Raw OpenAPI YAML endpoint
    app.get('/api-docs/yaml', (req, res) => {
        res.type('text/yaml');
        res.send(YAML.stringify(openApiSpec, 10));
    });

    logger.info(' API Documentation available at /api-docs');
    logger.info(' OpenAPI JSON available at /api-docs/json');
    logger.info(' OpenAPI YAML available at /api-docs/yaml');
} else {
    logger.warn('  API Documentation not available - openapi.yaml not found');
}


app.use('/api/v1/auth', authRoutes);


//404 route 
app.use((req,res)=>{
    res.status(404).json({
        status:'error',
        message:'Route not found'
    })
})

app.use(errorHandler)
