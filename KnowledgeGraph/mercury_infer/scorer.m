:- module scorer.
:- interface.

:- import_module types.

:- pred score(inference_result::in, float::out) is det.

:- implementation.

score(valid(Facts), Score) :-
    Pos = list.length(Facts),
    Score = float(Pos) / 10.0.

score(invalid(Facts), Score) :-
    Neg = list.length(Facts),
    Score = -float(Neg).