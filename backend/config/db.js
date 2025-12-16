let mongoose=require('mongoose');

let connectdb=async()=>{
    try{
        let connect=await mongoose.connect(process.env.MONGOdb_URI)
                console.log("connected to mongodb")
    }
    catch(err){
        console.log(err)
        process.exit(1)
    }
}
module.exports=connectdb;