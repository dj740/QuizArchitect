'use client';

import React, { useState } from "react";
import Image from "next/image"; // Ensure you import Image from next/image
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import convertFromFaToText from "@/app/convertFromFaToText";
import convertToFaIcons from "@/app/convertToFaIcons";
import useGlobalContextProvider from '@/app/ContextApi';

function validateQuizQuestions(quizQuestions) {
    for(let question of quizQuestions) {
        if (!question.mainQuestion.trim()) {
            return { valid: false, message: 'Please fill in the main question.' };
        }
        if (question.choices.some((choice) => !choice.trim().substring(2))) {
            return { valid: false, message: 'Please fill in all the choices.' };
        }
        if (question.correctAnswer.length === 0) {
            return { valid: false, message: 'Please specify the correct answer.' };
        }
    }
    return { valid: true };
}

function QuizBuildNav({ newQuiz, setNewQuiz }) {
    const { allQuizzes, setAllQuizzes, selectedQuizObject } = useGlobalContextProvider();
    const { selectedQuiz, setSelectedQuiz } = selectedQuizObject;
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function createNewQuiz() {
        try {
            setIsLoading(true);
            const textIcon = convertFromFaToText(newQuiz.icon);
            const quizWithTextIcon = { ...newQuiz, icon: textIcon };

            const res = await fetch('http://localhost:3000/api/quizzes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quizWithTextIcon),
            });

            if (!res.ok) {
                toast.error('Failed to create a new quiz!');
                setIsLoading(false);
                return;
            }

            const { id } = await res.json();
            const updatedQuiz = { ...newQuiz, _id: id, icon: textIcon };
            setAllQuizzes([...allQuizzes, updatedQuiz]);

            toast.success('The quiz has been created successfully');
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }

    async function saveQuiz() {
        if (newQuiz.quizTitle.trim().length === 0) {
            return toast.error('Please add a name for the quiz.');
        }

        const isValid = validateQuizQuestions(newQuiz.quizQuestions);
        if (isValid.valid === false) {
            toast.error(isValid.message);
            return;
        }

        if (selectedQuiz) {
            const updatedQuiz = [...allQuizzes];
            const findIndexQuiz = updatedQuiz.findIndex(quiz => quiz._id === newQuiz._id);

            if (findIndexQuiz !== -1) {
                updatedQuiz[findIndexQuiz] = newQuiz;
            }
            const id = updatedQuiz[findIndexQuiz]._id;
            const convertIconText = convertFromFaToText(updatedQuiz[findIndexQuiz].icon);
            updatedQuiz[findIndexQuiz].icon = convertIconText;

            try {
                const res = await fetch(`http://localhost:3000/api/quizzes?id=${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedQuiz[findIndexQuiz]),
                });

                if (!res.ok) {
                    throw new Error('Failed to update quiz');
                }

                toast.success('The quiz has been saved successfully.');
                setAllQuizzes(updatedQuiz);
            } catch (error) {
                toast.error('Failed to update quiz');
                console.log(error);
            }
        } else {
            createNewQuiz();
        }

        router.push('/');
    }

    return (
        <div className="poppins mx-12 my-12 flex justify-between items-center">
            <div className="flex gap-2 items-center">
                <Image src="/quizapp_icon.png" alt="" height={50} width={50} />
                <span className="text-2xl">
                    Quiz <span className="text-green-700 font-bold">Builder</span>
                </span>
            </div>
            <button
                onClick={saveQuiz}
                className="p-2 px-4 bg-green-700 rounded-md text-white"
                disabled={isLoading}>
                Save
            </button>
        </div>
    );
}

export default QuizBuildNav;
