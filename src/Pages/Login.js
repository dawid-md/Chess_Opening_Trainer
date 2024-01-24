import { useForm } from "react-hook-form";
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../Config/firebase";

const schema = yup.object().shape({
    email: yup.string().email('Email must be valid').required('Email is required'),
    password: yup.string()
                 .required('Password is required')
                 .min(6, 'Password must be at least 6 characters long'), // Add this line
});

export default function Login() {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(schema)
    });
    const navigate = useNavigate();

    const onSubmit = async (formData) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            console.log("User logged in", userCredential);
            navigate('/'); //Redirect to home
        } catch (error) {
            const errorCode = error.code;
            const errorMessage = error.message;
            console.log("Login error", errorCode, errorMessage);
        }
    };

    return (
        <div className="loginDiv">
            <h1>Hi, wanna sign in?</h1>
            <form className="loginForm" onSubmit={handleSubmit(onSubmit)}>
                <div className="form-field">
                    <input type="text" placeholder="Email..." {...register("email")} />
                    <div className="error-message">{errors.email && <p>{errors.email.message}</p>}</div>
                </div>

                <div className="form-field">
                    <input type="password" placeholder="Password..." {...register("password")} />
                    <div className="error-message">{errors.password && <p>{errors.password.message}</p>}</div>
                </div>

                <button className="loginButton" type="submit">Continue</button>
                
            </form>
            <button className="testUserButton" onClick={() => onSubmit({email:'maddawid.91@gmail.com', password:'caps12'})}>Log in as Test User</button>
        </div>
    );
}