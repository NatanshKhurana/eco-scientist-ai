const User = require("../models/User");


exports.createUser = async(req,res)=>{

    try{

        const {
            name,
            email
        } = req.body;


        const user = await User.create({

            name,
            email

        });


        res.status(201).json({

            success:true,

            userId:user._id,

            user

        });


    }
    catch(error){

        res.status(500).json({

            error:error.message

        });

    }

};