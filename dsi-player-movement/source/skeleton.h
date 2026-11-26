// SPDX-License-Identifier: CC0-1.0
// Small procedural pose builder for the DSi player skeleton prototype.
#ifndef OOT_DSI_SKELETON_H
#define OOT_DSI_SKELETON_H

typedef struct {
    float left_leg;
    float right_leg;
    float left_arm;
    float right_arm;
} SkeletonPose;

void skeleton_build_walk_pose(SkeletonPose *pose, float phase, int moving);

#endif
