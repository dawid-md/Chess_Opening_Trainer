import { auth } from "../Config/firebase";
import { useForm } from "react-hook-form"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup';

const schema = yup.object().shape({
    name: yup.string().required('Name is required'),
    email: yup.string().email('Email must be valid').required('Email is required'),
    password: yup.string().min(6, 'Password must be at least 6 characters').max(20, 'Password cannot be more than 20 characters').required('Password is required'),
    confirmPassword: yup.string().oneOf([yup.ref('password'), null], 'Passwords must match').required('Confirming password is required'),
});

export default function Register(){
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });
    const navigate = useNavigate()

    const onSubmit = async (formData) =>{
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            await updateProfile(userCredential.user, {
                displayName: formData.name
            });
            console.log("User signed up and name set in profile");
            navigate('/')
        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log(errorCode);
            console.log(errorMessage);
        }
    }

    return(
        <div className="loginDiv">
            <h1>Hi, wanna sign up?</h1>
            <form className="loginForm" onSubmit={handleSubmit(onSubmit)}>

                <div className="form-field">
                    <input type="text" placeholder="Name..." {...register("name")} />
                    <div className="error-message">{errors.name && <p>{errors.name.message}</p>}</div>
                </div>

                <div className="form-field">
                    <input type="text" placeholder="Email..." {...register("email")} />
                    <div className="error-message">{errors.email && <p>{errors.email.message}</p>}</div>
                </div>

                <div className="form-field">
                    <input type="password" placeholder="Password..." {...register("password")} />
                    <div className="error-message">{errors.password && <p>{errors.password.message}</p>}</div>
                </div>

                <div className="form-field">
                    <input type="password" placeholder="Confirm Password..." {...register("confirmPassword")} />
                    <div className="error-message">{errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}</div>
                </div>

                <button className="loginButton" type="submit">Continue</button>
            </form>
        </div>
    )
}