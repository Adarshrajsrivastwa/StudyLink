let express=require('express');
require('dotenv').config();
let app=express();
let cors=require('cors');
const http = require('http');

let connectdb=require('./config/db');
connectdb();

const otpRoutes = require("./routes/otpRoutes");
const authRoute = require("./routes/auth.route");
const resourceRoute = require("./routes/resource.route");
const courseRoute = require("./routes/course.route");
const chatRoute = require("./routes/chat.route");
const mentorRoute = require("./routes/mentor.route");
const settingsRoute = require("./routes/settings.route");
const sessionRoute = require("./routes/session.route");
const adminRoute = require("./routes/admin.route");
const communityRoute = require("./routes/community.route");
const { initializeSocket } = require("./socket");

app.use(
  cors({
    origin: ["http://localhost:8080", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get('/',(req,res)=>{
    res.send('Hello World!');
});

app.use("/api/otp", otpRoutes);
app.use("/api/auth", authRoute);
app.use("/api/resources", resourceRoute);
app.use("/api/courses", courseRoute);
app.use("/api/chat", chatRoute);
app.use("/api/mentors", mentorRoute);
app.use("/api/settings", settingsRoute);
app.use("/api/sessions", sessionRoute);
app.use("/api/admin", adminRoute);
app.use("/api/communities", communityRoute);

const PORT=process.env.PORT || 5000
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Socket.io server is ready for real-time chat`);
}); 