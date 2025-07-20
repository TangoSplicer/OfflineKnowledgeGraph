:- module proof.encoder.json_encoder.
:- interface.
:- import_module list, string.

:- func encode_trace(list(string)) = string.

:- implementation.

encode_trace(Trace) = JSONStr :-
    StepsJSON = map((func(S) = "\"" ++ S ++ "\""), Trace),
    string.join_list(", ", StepsJSON) = Inner,
    "[" ++ Inner ++ "]" = JSONStr.